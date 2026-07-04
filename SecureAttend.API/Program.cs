using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using SecureAttend.API.Data;
using SecureAttend.API.GraphQL;
using System.Threading.RateLimiting;
using System;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

// 1. Database & ORM Setup (Entity Framework Core - PostgreSQL)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Setup JWT & Cookie Auth
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrEmpty(jwtSecret) || jwtSecret.Length < 32)
{
    throw new System.Exception("CRITICAL SECURITY ERROR: Jwt:Secret is missing or too short in configuration.");
}
var key = System.Text.Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Development only
    options.SaveToken = true;
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
    };
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["RuangHadir_Session"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return System.Threading.Tasks.Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor(); // Required for GraphQL to access cookies

// 3. Add GraphQL Server
builder.Services
    .AddGraphQLServer()
    .AddAuthorization()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>();

// 4. Anti-DDoS & Rate Limiting (Token Bucket - 10 request/sec per IP)
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new TokenBucketRateLimiterOptions
            {
                AutoReplenishment = true,
                TokenLimit = 10,
                TokensPerPeriod = 10,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1)
            }));
    options.RejectionStatusCode = 429;
});

// 5. CORS untuk Next.js Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://ruang-hadir-eight.vercel.app") // Local & Vercel
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Run Migrations & Seeder
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate(); // Auto-migrate ke Neon.tech
    DatabaseSeeder.Initialize(services);
}

// 6. Anti-Scanner Drop Mechanism (HTTP 444)
app.Use(async (context, next) =>
{
    var userAgent = context.Request.Headers["User-Agent"].ToString().ToLower();
    string[] scanners = { "burp", "zap", "sqlmap", "nikto", "nmap" };
    
    if (scanners.Any(s => userAgent.Contains(s)))
    {
        // Custom HTTP 444 No Response
        context.Response.StatusCode = 444; 
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});

app.UseCors("FrontendPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGraphQL();

app.Run();
