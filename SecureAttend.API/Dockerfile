FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["SecureAttend.API.csproj", "./"]
RUN dotnet restore "SecureAttend.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "SecureAttend.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Railway injects PORT environment variable.
ENV PORT=8080
ENV ASPNETCORE_URLS=http://+:${PORT}

ENTRYPOINT ["dotnet", "SecureAttend.API.dll"]
