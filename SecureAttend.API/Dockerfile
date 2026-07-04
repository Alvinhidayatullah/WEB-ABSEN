FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["SecureAttend.API.csproj", "./"]
RUN dotnet restore "SecureAttend.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "SecureAttend.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Railway injects PORT environment variable.
# We configure ASP.NET Core to listen on that port.
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}

ENTRYPOINT ["dotnet", "SecureAttend.API.dll"]
