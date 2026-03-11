using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Product
        mb.Entity<Product>().HasIndex(p => p.SKU).IsUnique();
        mb.Entity<Product>().Property(p => p.CostPrice).HasColumnType("decimal(18,2)");
        mb.Entity<Product>().Property(p => p.SellingPrice).HasColumnType("decimal(18,2)");

        // InventoryTransaction
        mb.Entity<InventoryTransaction>().Property(t => t.UnitPrice).HasColumnType("decimal(18,2)");
        mb.Entity<InventoryTransaction>().Property(t => t.Type).HasConversion<string>();

        // Order
        mb.Entity<Order>().Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
        mb.Entity<Order>().Property(o => o.Status).HasConversion<string>();

        // OrderItem
        mb.Entity<OrderItem>().Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");

        // User
        mb.Entity<User>().HasIndex(u => u.Username).IsUnique();
        mb.Entity<User>().Property(u => u.Role).HasConversion<string>();

        // RefreshToken
        mb.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationships
        mb.Entity<Product>()
            .HasOne(p => p.Supplier).WithMany(s => s.Products)
            .HasForeignKey(p => p.SupplierId).OnDelete(DeleteBehavior.SetNull);

        mb.Entity<Order>()
            .HasOne(o => o.Supplier).WithMany(s => s.Orders)
            .HasForeignKey(o => o.SupplierId).OnDelete(DeleteBehavior.SetNull);

        mb.Entity<OrderItem>()
            .HasOne(i => i.Order).WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);

        mb.Entity<OrderItem>()
            .HasOne(i => i.Product).WithMany(p => p.OrderItems)
            .HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);

        mb.Entity<InventoryTransaction>()
            .HasOne(t => t.Product).WithMany(p => p.Transactions)
            .HasForeignKey(t => t.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}