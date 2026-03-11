using Microsoft.EntityFrameworkCore;
using WarehouseAPI.Data;
using WarehouseAPI.Entities;

namespace WarehouseAPI.Repositories;

public class OrderRepository(AppDbContext db) : IOrderRepository
{
    public async Task<IEnumerable<Order>> GetAllAsync()
        => await db.Orders
            .Include(o => o.Supplier)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<Order?> GetByIdAsync(int id)
        => await db.Orders
            .Include(o => o.Supplier)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

    public async Task<Order> CreateAsync(Order order)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    public async Task<Order> UpdateAsync(Order order)
    {
        db.Orders.Update(order);
        await db.SaveChangesAsync();
        return order;
    }
}