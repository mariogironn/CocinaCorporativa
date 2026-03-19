// IMPORTAMOS LAS DEPENDENCIAS NECESARIAS
// ==============================================

// Microsoft.AspNetCore.Mvc: Nos da las herramientas para crear controladores de API
// (Atributos como [ApiController], [Route], [HttpGet], etc.)
using Microsoft.AspNetCore.Mvc;

// Microsoft.EntityFrameworkCore: Nos permite usar Entity Framework para consultar la base de datos
// (Métodos como CountAsync, Where, etc.)
using Microsoft.EntityFrameworkCore;

// CocinaCorporativa.AccesoDatos: Es el espacio de nombres donde está nuestro DbContext
// (La clase que representa la base de datos)
using CocinaCorporativa.AccesoDatos;

// DEFINICIÓN DEL NAMESPACE (CONTENEDOR DEL CONTROLADOR)
// ==============================================
namespace CocinaCorporativa.API.Controllers
{
    /// <summary>
    /// Este controlador maneja todas las peticiones relacionadas con el Dashboard
    /// Es decir, los datos que se muestran en la página principal de la aplicación
    /// </summary>

    // [ApiController] es un atributo que:
    // - Hace que el controlador responda a peticiones API
    // - Hace validación automática de modelos
    // - Da mejores mensajes de error
    [ApiController]

    // [Route] define la URL base para acceder a este controlador
    // "api/[controller]" significa: api/Dashboard
    // [controller] se reemplaza automáticamente por el nombre del controlador sin "Controller"
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase // Hereda de ControllerBase para tener funcionalidades de API
    {
        // VARIABLE PRIVADA PARA EL CONTEXTO DE BASE DE DATOS
        // ==============================================
        // Esta variable guardará la referencia a nuestro DbContext
        // Es "private readonly" porque:
        // - private: solo se usa dentro de esta clase
        // - readonly: solo se asigna en el constructor y no cambia después
        private readonly CocinaCorporativaContext _context;

        /// <summary>
        /// CONSTRUCTOR DEL CONTROLADOR
        /// Se ejecuta automáticamente cuando alguien crea una instancia de este controlador
        /// </summary>
        /// <param name="context">Recibe el contexto de BD por inyección de dependencias</param>
        public DashboardController(CocinaCorporativaContext context)
        {
            // Asignamos el contexto recibido a nuestra variable privada
            // Así podemos usarlo en todos los métodos del controlador
            _context = context;
        }

        /// <summary>
        /// MÉTODO PRINCIPAL: OBTENER RESUMEN DEL DASHBOARD
        /// Endpoint: GET api/Dashboard/resumen
        /// </summary>
        /// <returns>Un objeto JSON con todas las métricas del dashboard</returns>

        // [HttpGet("resumen")] indica que este método responde a peticiones GET
        // La URL completa sería: https://localhost:7042/api/Dashboard/resumen
        [HttpGet("resumen")]

        // async Task<IActionResult> significa:
        // - async: el método es asíncrono (no bloquea el hilo principal)
        // - Task: representa una operación que se completará en el futuro
        // - IActionResult: puede devolver diferentes tipos de respuestas HTTP (OK, Error, etc.)
        public async Task<IActionResult> GetResumen()
        {
            // PASO 1: DEFINIR FECHAS PARA FILTRAR
            // ==============================================

            // DateTime.Today devuelve la fecha actual SIN HORA
            // Ejemplo: si hoy es 8/3/2026 a las 15:30, hoy = 8/3/2026 00:00
            var hoy = DateTime.Today;

            // AddDays(1) suma un día a la fecha
            // manana = 9/3/2026 00:00 (el inicio del día siguiente)
            // Esto nos sirve para filtrar: queremos fechas >= hoy Y < mañana
            // Así obtenemos exactamente el día de hoy completo
            var manana = hoy.AddDays(1);

            // PASO 2: CONTAR PRODUCTOS ACTIVOS
            // ==============================================
            // _context.Productos: accedemos a la tabla Productos
            // CountAsync(): cuenta cuántos registros cumplen la condición
            // p => p.Estado == 1 es una expresión lambda que significa:
            // "para cada producto p, cuéntalo si su Estado es igual a 1 (activo)"
            // await: esperamos a que la BD termine de contar (operación asíncrona)
            var totalProductos = await _context.Productos.CountAsync(p => p.Estado == 1);

            // PASO 3: CONTAR PROVEEDORES ACTIVOS
            // ==============================================
            // Misma lógica que productos pero con la tabla Proveedors
            var totalProveedores = await _context.Proveedors.CountAsync(p => p.Estado == 1);

            // PASO 4: CONTAR MOVIMIENTOS DE INVENTARIO DE HOY
            // ==============================================
            // Filtramos por:
            // - Estado activo (m.Estado == 1)
            // - Fecha mayor o igual a hoy (m.Fecha >= hoy)
            // - Fecha menor a mañana (m.Fecha < manana)
            // Esto captura todos los movimientos desde las 00:00 hasta las 23:59:59
            var movimientosHoy = await _context.InventarioMovimientos
                .CountAsync(m => m.Estado == 1 && m.Fecha >= hoy && m.Fecha < manana);

            // PASO 5: CONTAR CONSUMOS DE HOY
            // ==============================================
            // Misma lógica que movimientos pero con la tabla Consumos
            var consumosHoy = await _context.Consumos
                .CountAsync(c => c.Estado == 1 && c.Fecha >= hoy && c.Fecha < manana);

            // PASO 6: CONTAR PRODUCTOS CON STOCK BAJO (ALERTAS)
            // ==============================================
            // Filtramos inventarios activos donde:
            // - StockActual <= StockMinimo (el stock actual es menor o igual al mínimo permitido)
            // Esto genera alertas para reabastecer
            var stockBajo = await _context.Inventarios
                .CountAsync(i => i.Estado == 1 && i.StockActual <= i.StockMinimo);

            // PASO 7: DEVOLVER LA RESPUESTA
            // ==============================================
            // Ok() es un método que devuelve HTTP 200 (éxito)
            // Dentro creamos un objeto anónimo (new { }) con todas las propiedades calculadas
            // Esto se convertirá automáticamente a JSON
            return Ok(new
            {
                fecha = hoy,           // La fecha del resumen
                totalProductos,         // Cantidad de productos
                totalProveedores,       // Cantidad de proveedores
                movimientosHoy,         // Movimientos hoy
                consumosHoy,            // Consumos hoy
                stockBajo               // Alertas de stock
            });

            // EJEMPLO DE LO QUE EL FRONTEND RECIBIRÁ:
            // {
            //   "fecha": "2026-03-08T00:00:00",
            //   "totalProductos": 150,
            //   "totalProveedores": 12,
            //   "movimientosHoy": 34,
            //   "consumosHoy": 28,
            //   "stockBajo": 3
            // }
        }
    }
}