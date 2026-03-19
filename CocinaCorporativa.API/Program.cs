using Microsoft.EntityFrameworkCore;
using CocinaCorporativa.AccesoDatos;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// --- 1. CONFIGURACIÓN DE BASE DE DATOS ---
builder.Services.AddDbContext<CocinaCorporativaContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("CadenaSQL"));
});

// --- 2. CONFIGURACIÓN CORS (NECESARIO PARA REACT) ---
// Esto permite que tu página web (React) se comunique con esta API
builder.Services.AddCors(options =>
{
    options.AddPolicy("NuevaPolitica", app =>
    {
        app.AllowAnyOrigin()  // Permite conexiones desde cualquier dirección (localhost:3000, etc)
           .AllowAnyHeader()  // Permite enviar headers como JSON
           .AllowAnyMethod(); // Permite GET, POST, PUT, DELETE
    });
});

builder.Services.AddControllers();

// Configuración de Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// --- 3. ACTIVAR CORS ---
// Importante: Debe ir antes de UseAuthorization y MapControllers
app.UseCors("NuevaPolitica");

app.UseAuthorization();

app.MapControllers();

app.Run();