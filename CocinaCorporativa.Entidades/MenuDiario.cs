using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class MenuDiario
{
    public int MenuDiarioId { get; set; }

    public int SedeId { get; set; }

    public DateOnly Fecha { get; set; }

    public int TiempoComidaId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<MenuDiarioDetalle> MenuDiarioDetalles { get; set; } = new List<MenuDiarioDetalle>();

    public virtual Sede Sede { get; set; } = null!;

    public virtual TiempoComidum TiempoComida { get; set; } = null!;
}
