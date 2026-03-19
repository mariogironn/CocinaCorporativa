using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class TiempoComidum
{
    public int TiempoComidaId { get; set; }

    public string Nombre { get; set; } = null!;

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<MenuDiario> MenuDiarios { get; set; } = new List<MenuDiario>();
}
