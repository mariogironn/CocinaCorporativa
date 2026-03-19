using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class UnidadMedidum
{
    public int UnidadMedidaId { get; set; }

    public string Nombre { get; set; } = null!;

    public string Abreviatura { get; set; } = null!;

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<ConversionUnidad> ConversionUnidadUnidadDestinos { get; set; } = new List<ConversionUnidad>();

    public virtual ICollection<ConversionUnidad> ConversionUnidadUnidadOrigens { get; set; } = new List<ConversionUnidad>();

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual ICollection<Recetum> Receta { get; set; } = new List<Recetum>();
}
