using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Sede
{
    public int SedeId { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Ubicacion { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<Colaborador> Colaboradors { get; set; } = new List<Colaborador>();

    public virtual ICollection<Inventario> Inventarios { get; set; } = new List<Inventario>();

    public virtual ICollection<MenuDiario> MenuDiarios { get; set; } = new List<MenuDiario>();

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
