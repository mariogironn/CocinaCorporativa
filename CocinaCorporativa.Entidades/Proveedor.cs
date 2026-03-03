using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Proveedor
{
    public int ProveedorId { get; set; }

    public string Nombre { get; set; } = null!;

    public string? NombreContacto { get; set; }

    public string? Telefono { get; set; }

    public string? Email { get; set; }

    public string? Direccion { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();
}
