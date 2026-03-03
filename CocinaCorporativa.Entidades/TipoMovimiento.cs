using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class TipoMovimiento
{
    public int TipoMovimientoId { get; set; }

    public string Nombre { get; set; } = null!;

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();
}
