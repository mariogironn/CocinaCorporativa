using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Colaborador
{
    public int ColaboradorId { get; set; }

    public string CodigoEmpleado { get; set; } = null!;

    public string CodigoEmpresa { get; set; } = null!;

    public string? NombreCompleto { get; set; }

    public string? Departamento { get; set; }

    public int? SedeId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<Consumo> Consumos { get; set; } = new List<Consumo>();

    public virtual Sede? Sede { get; set; }
}
