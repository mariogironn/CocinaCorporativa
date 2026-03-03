using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class ConversionUnidad
{
    public int ConversionUnidadId { get; set; }

    public int UnidadOrigenId { get; set; }

    public int UnidadDestinoId { get; set; }

    public decimal Factor { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual UnidadMedidum UnidadDestino { get; set; } = null!;

    public virtual UnidadMedidum UnidadOrigen { get; set; } = null!;
}
