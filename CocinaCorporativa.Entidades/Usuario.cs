using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Usuario
{
    public int UsuarioId { get; set; }

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? NombreCompleto { get; set; }

    public int RolId { get; set; }

    public int? SedeId { get; set; }

    public DateTime? FechaBaja { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<Consumo> Consumos { get; set; } = new List<Consumo>();

    public virtual ICollection<InventarioMovimiento> InventarioMovimientos { get; set; } = new List<InventarioMovimiento>();

    public virtual Rol Rol { get; set; } = null!;

    public virtual Sede? Sede { get; set; }
}
