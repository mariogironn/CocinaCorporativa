using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CocinaCorporativa.AccesoDatos;
using CocinaCorporativa.Entidades;

namespace CocinaCorporativa.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly CocinaCorporativaContext _context;

        public AuthController(CocinaCorporativaContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // CORRECCIÓN PRINCIPAL:
            // Usamos 'u.Username' porque así se llama en tu clase Usuario.cs
            // Usamos 'u.PasswordHash' porque así se llama en tu clase Usuario.cs
            var usuarioDb = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Username == request.Usuario && u.PasswordHash == request.Contrasena);

            if (usuarioDb == null)
            {
                return Unauthorized(new { mensaje = "Acceso denegado: Usuario o contraseña incorrectos" });
            }

            return Ok(new
            {
                mensaje = "¡Bienvenido al sistema!",
                // Usamos 'NombreCompleto' porque así está en tu base de datos
                usuario = usuarioDb.NombreCompleto,
                rolId = usuarioDb.RolId
            });
        }
    }
}