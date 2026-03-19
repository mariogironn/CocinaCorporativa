using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Recetum
{
    public int RecetaId { get; set; }

    public int PlatilloId { get; set; }

    public int ProductoId { get; set; }

    public decimal Cantidad { get; set; }

    public int UnidadMedidaId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual Platillo Platillo { get; set; } = null!;

    public virtual Producto Producto { get; set; } = null!;

    public virtual UnidadMedidum UnidadMedida { get; set; } = null!;
}
