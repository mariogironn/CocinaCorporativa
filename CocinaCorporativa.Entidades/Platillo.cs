using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Platillo
{
    public int PlatilloId { get; set; }

    public string Nombre { get; set; } = null!;

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<MenuDiarioDetalle> MenuDiarioDetalles { get; set; } = new List<MenuDiarioDetalle>();

    public virtual ICollection<Recetum> Receta { get; set; } = new List<Recetum>();
}
