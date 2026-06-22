-- ============================================================
-- Run this in Supabase SQL Editor
-- ONLY the RPC functions — no publication lines
-- ============================================================

-- Function: get all orders for admin (bypasses RLS)
create or replace function get_all_orders_for_admin()
returns setof json
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select row_to_json(t) from (
      select
        o.*,
        coalesce(
          (select json_agg(i) from order_items i where i.order_id = o.id),
          '[]'::json
        ) as order_items,
        coalesce(
          (select json_agg(h) from order_history h where h.order_id = o.id),
          '[]'::json
        ) as order_history,
        coalesce(
          (select json_agg(s) from shipments s where s.order_id = o.id),
          '[]'::json
        ) as shipments
      from orders o
      order by o.created_at desc
    ) t;
end;
$$;

-- Function: get available orders for delivery (bypasses RLS)
create or replace function get_available_orders_for_delivery()
returns setof json
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select row_to_json(t) from (
      select
        o.*,
        coalesce(
          (select json_agg(i) from order_items i where i.order_id = o.id),
          '[]'::json
        ) as order_items
      from orders o
      where o.assigned_to is null
        and o.status != 'delivered'
        and o.status != 'cancelled'
      order by o.created_at asc
    ) t;
end;
$$;

-- Function: get orders assigned to a delivery agent (bypasses RLS)
create or replace function get_my_deliveries(agent_id uuid)
returns setof json
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select row_to_json(t) from (
      select
        o.*,
        coalesce(
          (select json_agg(i) from order_items i where i.order_id = o.id),
          '[]'::json
        ) as order_items,
        coalesce(
          (select json_agg(h order by h.at asc) from order_history h where h.order_id = o.id),
          '[]'::json
        ) as order_history
      from orders o
      where o.assigned_to = agent_id
      order by o.created_at desc
    ) t;
end;
$$;

-- Grant execute permissions
grant execute on function get_all_orders_for_admin() to authenticated;
grant execute on function get_available_orders_for_delivery() to authenticated;
grant execute on function get_my_deliveries(uuid) to authenticated;
