using System;
using System.Collections.Generic;
using CocinaCorporativa.Entidades;
using Microsoft.EntityFrameworkCore;

namespace CocinaCorporativa.AccesoDatos;

public partial class CocinaCorporativaContext : DbContext
{
    public CocinaCorporativaContext()
    {
    }

    public CocinaCorporativaContext(DbContextOptions<CocinaCorporativaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Colaborador> Colaboradors { get; set; }

    public virtual DbSet<Consumo> Consumos { get; set; }

    public virtual DbSet<ConversionUnidad> ConversionUnidads { get; set; }

    public virtual DbSet<Inventario> Inventarios { get; set; }

    public virtual DbSet<InventarioMovimiento> InventarioMovimientos { get; set; }

    public virtual DbSet<MenuDiario> MenuDiarios { get; set; }

    public virtual DbSet<MenuDiarioDetalle> MenuDiarioDetalles { get; set; }

    public virtual DbSet<Platillo> Platillos { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Proveedor> Proveedors { get; set; }

    public virtual DbSet<Recetum> Receta { get; set; }

    public virtual DbSet<Rol> Rols { get; set; }

    public virtual DbSet<Sede> Sedes { get; set; }

    public virtual DbSet<TiempoComidum> TiempoComida { get; set; }

    public virtual DbSet<TipoMovimiento> TipoMovimientos { get; set; }

    public virtual DbSet<TipoProducto> TipoProductos { get; set; }

    public virtual DbSet<UnidadMedidum> UnidadMedida { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=MARIO\\SQLEXPRESS;Database=CocinaCorporativa;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Colaborador>(entity =>
        {
            entity.ToTable("Colaborador");

            entity.HasIndex(e => new { e.CodigoEmpresa, e.CodigoEmpleado }, "UQ_Colaborador_Empresa_Empleado").IsUnique();

            entity.Property(e => e.CodigoEmpleado)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CodigoEmpresa)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Departamento)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.NombreCompleto)
                .HasMaxLength(150)
                .IsUnicode(false);

            entity.HasOne(d => d.Sede).WithMany(p => p.Colaboradors)
                .HasForeignKey(d => d.SedeId)
                .HasConstraintName("FK_Colaborador_Sede");
        });

        modelBuilder.Entity<Consumo>(entity =>
        {
            entity.ToTable("Consumo");

            entity.HasIndex(e => new { e.MenuDiarioDetalleId, e.Fecha }, "IX_Consumo_Detalle_Fecha").IsDescending(false, true);

            entity.HasIndex(e => new { e.MenuDiarioDetalleId, e.ColaboradorId }, "UQ_Consumo_Detalle_Colaborador").IsUnique();

            entity.Property(e => e.CantidadPorciones).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.Fecha)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Colaborador).WithMany(p => p.Consumos)
                .HasForeignKey(d => d.ColaboradorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Consumo_Colaborador");

            entity.HasOne(d => d.MenuDiarioDetalle).WithMany(p => p.Consumos)
                .HasForeignKey(d => d.MenuDiarioDetalleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Consumo_MenuDiarioDetalle");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Consumos)
                .HasForeignKey(d => d.UsuarioId)
                .HasConstraintName("FK_Consumo_Usuario");
        });

        modelBuilder.Entity<ConversionUnidad>(entity =>
        {
            entity.ToTable("ConversionUnidad");

            entity.HasIndex(e => new { e.UnidadOrigenId, e.UnidadDestinoId }, "UQ_ConversionUnidad_Par").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.Factor).HasColumnType("decimal(18, 8)");
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.UnidadDestino).WithMany(p => p.ConversionUnidadUnidadDestinos)
                .HasForeignKey(d => d.UnidadDestinoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ConversionUnidad_Destino");

            entity.HasOne(d => d.UnidadOrigen).WithMany(p => p.ConversionUnidadUnidadOrigens)
                .HasForeignKey(d => d.UnidadOrigenId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ConversionUnidad_Origen");
        });

        modelBuilder.Entity<Inventario>(entity =>
        {
            entity.ToTable("Inventario");

            entity.HasIndex(e => new { e.SedeId, e.ProductoId }, "UQ_Inventario_Sede_Producto").IsUnique();

            entity.Property(e => e.CostoPromedio).HasColumnType("decimal(12, 4)");
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.StockActual).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.StockMinimo).HasColumnType("decimal(12, 2)");

            entity.HasOne(d => d.Producto).WithMany(p => p.Inventarios)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Inventario_Producto");

            entity.HasOne(d => d.Sede).WithMany(p => p.Inventarios)
                .HasForeignKey(d => d.SedeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Inventario_Sede");
        });

        modelBuilder.Entity<InventarioMovimiento>(entity =>
        {
            entity.ToTable("InventarioMovimiento");

            entity.HasIndex(e => new { e.InventarioId, e.Fecha }, "IX_InventarioMovimiento_Inventario_Fecha").IsDescending(false, true);

            entity.Property(e => e.Cantidad).HasColumnType("decimal(12, 2)");
            entity.Property(e => e.CostoUnitario).HasColumnType("decimal(12, 4)");
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.Fecha)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Referencia)
                .HasMaxLength(200)
                .IsUnicode(false);

            entity.HasOne(d => d.Inventario).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.InventarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvMov_Inventario");

            entity.HasOne(d => d.Proveedor).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.ProveedorId)
                .HasConstraintName("FK_InvMov_Proveedor");

            entity.HasOne(d => d.TipoMovimiento).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.TipoMovimientoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvMov_TipoMovimiento");

            entity.HasOne(d => d.Usuario).WithMany(p => p.InventarioMovimientos)
                .HasForeignKey(d => d.UsuarioId)
                .HasConstraintName("FK_InvMov_Usuario");
        });

        modelBuilder.Entity<MenuDiario>(entity =>
        {
            entity.ToTable("MenuDiario");

            entity.HasIndex(e => new { e.SedeId, e.Fecha, e.TiempoComidaId }, "UQ_MenuDiario_Sede_Fecha_Tiempo").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Sede).WithMany(p => p.MenuDiarios)
                .HasForeignKey(d => d.SedeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MenuDiario_Sede");

            entity.HasOne(d => d.TiempoComida).WithMany(p => p.MenuDiarios)
                .HasForeignKey(d => d.TiempoComidaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MenuDiario_TiempoComida");
        });

        modelBuilder.Entity<MenuDiarioDetalle>(entity =>
        {
            entity.ToTable("MenuDiarioDetalle");

            entity.HasIndex(e => new { e.MenuDiarioId, e.PlatilloId }, "UQ_MenuDiarioDetalle_Menu_Platillo").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.MenuDiario).WithMany(p => p.MenuDiarioDetalles)
                .HasForeignKey(d => d.MenuDiarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MenuDiarioDetalle_Menu");

            entity.HasOne(d => d.Platillo).WithMany(p => p.MenuDiarioDetalles)
                .HasForeignKey(d => d.PlatilloId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MenuDiarioDetalle_Platillo");
        });

        modelBuilder.Entity<Platillo>(entity =>
        {
            entity.ToTable("Platillo");

            entity.HasIndex(e => e.Nombre, "UQ_Platillo_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("Producto");

            entity.HasIndex(e => e.Nombre, "UQ_Producto_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasOne(d => d.TipoProducto).WithMany(p => p.Productos)
                .HasForeignKey(d => d.TipoProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Producto_TipoProducto");

            entity.HasOne(d => d.UnidadMedida).WithMany(p => p.Productos)
                .HasForeignKey(d => d.UnidadMedidaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Producto_UnidadMedida");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("Proveedor");

            entity.HasIndex(e => e.Nombre, "UQ_Proveedor_Nombre").IsUnique();

            entity.Property(e => e.Direccion)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.NombreContacto)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(30)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Recetum>(entity =>
        {
            entity.HasKey(e => e.RecetaId);

            entity.HasIndex(e => new { e.PlatilloId, e.ProductoId }, "UQ_Receta_Platillo_Producto").IsUnique();

            entity.Property(e => e.Cantidad).HasColumnType("decimal(12, 4)");
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Platillo).WithMany(p => p.Receta)
                .HasForeignKey(d => d.PlatilloId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Receta_Platillo");

            entity.HasOne(d => d.Producto).WithMany(p => p.Receta)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Receta_Producto");

            entity.HasOne(d => d.UnidadMedida).WithMany(p => p.Receta)
                .HasForeignKey(d => d.UnidadMedidaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Receta_UnidadMedida");
        });

        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("Rol");

            entity.HasIndex(e => e.Nombre, "UQ_Rol_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Sede>(entity =>
        {
            entity.ToTable("Sede");

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Ubicacion)
                .HasMaxLength(200)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TiempoComidum>(entity =>
        {
            entity.HasKey(e => e.TiempoComidaId);

            entity.HasIndex(e => e.Nombre, "UQ_TiempoComida_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TipoMovimiento>(entity =>
        {
            entity.ToTable("TipoMovimiento");

            entity.HasIndex(e => e.Nombre, "UQ_TipoMovimiento_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(30)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TipoProducto>(entity =>
        {
            entity.ToTable("TipoProducto");

            entity.HasIndex(e => e.Nombre, "UQ_TipoProducto_Nombre").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<UnidadMedidum>(entity =>
        {
            entity.HasKey(e => e.UnidadMedidaId);

            entity.HasIndex(e => e.Abreviatura, "UQ_UnidadMedida_Abreviatura").IsUnique();

            entity.Property(e => e.Abreviatura)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuario");

            entity.HasIndex(e => e.Username, "UQ_Usuario_Username").IsUnique();

            entity.Property(e => e.Estado).HasDefaultValue(1);
            entity.Property(e => e.FechaActualiza).HasPrecision(0);
            entity.Property(e => e.FechaBaja).HasPrecision(0);
            entity.Property(e => e.FechaCrea)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.NombreCompleto)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Rol).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.RolId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Usuario_Rol");

            entity.HasOne(d => d.Sede).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.SedeId)
                .HasConstraintName("FK_Usuario_Sede");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
