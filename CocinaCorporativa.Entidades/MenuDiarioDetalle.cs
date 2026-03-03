using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class MenuDiarioDetalle
{
    public int MenuDiarioDetalleId { get; set; }

    public int MenuDiarioId { get; set; }

    public int PlatilloId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual ICollection<Consumo> Consumos { get; set; } = new List<Consumo>();

    public virtual MenuDiario MenuDiario { get; set; } = null!;

    public virtual Platillo Platillo { get; set; } = null!;
}
