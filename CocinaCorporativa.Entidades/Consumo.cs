using System;
using System.Collections.Generic;

namespace CocinaCorporativa.Entidades;

public partial class Consumo
{
    public int ConsumoId { get; set; }

    public int MenuDiarioDetalleId { get; set; }

    public int ColaboradorId { get; set; }

    public decimal CantidadPorciones { get; set; }

    public DateTime Fecha { get; set; }

    public int? UsuarioId { get; set; }

    public int Estado { get; set; }

    public int? UsuarioCrea { get; set; }

    public DateTime FechaCrea { get; set; }

    public int? UsuarioActualiza { get; set; }

    public DateTime? FechaActualiza { get; set; }

    public virtual Colaborador Colaborador { get; set; } = null!;

    public virtual MenuDiarioDetalle MenuDiarioDetalle { get; set; } = null!;

    public virtual Usuario? Usuario { get; set; }
}
