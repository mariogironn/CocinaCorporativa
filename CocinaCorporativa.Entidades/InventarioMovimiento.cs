using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class InventarioMovimiento
{
    public int InventarioMovimientoId { get; set; }

    public int InventarioId { get; set; }

    public int TipoMovimientoId { get; set; }

    public int? ProveedorId { get; set; }

    public decimal Cantidad { get; set; }

    public decimal? CostoUnitario { get; set; }

    public DateTime Fecha { get; set; }

    public string? Referencia { get; set; }

    public int? UsuarioId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual Inventario Inventario { get; set; } = null!;

    public virtual Proveedor? Proveedor { get; set; }

    public virtual TipoMovimiento TipoMovimiento { get; set; } = null!;

    public virtual Usuario? Usuario { get; set; }
}
