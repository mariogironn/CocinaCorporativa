using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Inventario
{
    public int InventarioId { get; set; }

    public int SedeId { get; set; }

    public int ProductoId { get; set; }

    public decimal StockActual { get; set; }

    public decimal StockMinimo { get; set; }

    public decimal CostoPromedio { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();

    public virtual Producto Producto { get; set; } = null!;

    public virtual Sede Sede { get; set; } = null!;
}
