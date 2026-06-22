-- ============================================================
-- Run this in Supabase SQL Editor
-- Adds cancel order function for customers
-- ============================================================

create or replace function cancel_order_by_user(p_order_id text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
begin
  -- Fetch the order
  select * into v_order from orders where id = p_order_id;

  -- Check order exists and belongs to caller
  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  if v_order.user_id != auth.uid() then
    raise exception 'Not authorized to cancel this order';
  end if;

  -- Only allow cancel if placed or packed
  if v_order.status not in ('placed', 'packed') then
    raise exception 'Order cannot be cancelled at this stage';
  end if;

  -- Update order status
  update orders
    set status = 'cancelled', updated_at = now()
    where id = p_order_id;

  -- Insert history entry
  insert into order_history (order_id, status, at, note)
    values (p_order_id, 'cancelled', now(), p_note);

  -- Update shipment
  update shipments
    set shipment_status = 'cancelled'
    where order_id = p_order_id;
end;
$$;

grant execute on function cancel_order_by_user(text, text) to authenticated;
