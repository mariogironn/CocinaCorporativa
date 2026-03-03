using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Producto
{
    public int ProductoId { get; set; }

    public string Nombre { get; set; } = null!;

    public int TipoProductoId { get; set; }

    public int UnidadMedidaId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();

    public virtual ICollection<Recetum> Receta { get; set; } = new List<Recetum>();

    public virtual TipoProducto TipoProducto { get; set; } = null!;

    public virtual UnidadMedidum UnidadMedida { get; set; } = null!;
}
