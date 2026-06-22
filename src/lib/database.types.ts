export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type OrderStatus = "placed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
export type UserRole = "user" | "delivery" | "admin";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type NotificationType = "order_placed" | "payment_success" | "shipped" | "out_for_delivery" | "delivered";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: UserRole;
          phone: string | null;
          alt_phone: string | null;
          address: string | null;
          house_no: string | null;
          street: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          zip: string | null;
          location: string | null;
          avatar: string | null;
          wishlist: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      saved_addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          name: string;
          phone: string;
          line1: string;
          city: string;
          zip: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["saved_addresses"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["saved_addresses"]["Insert"]>;
      };
      payment_methods: {
        Row: {
          id: string;
          user_id: string;
          brand: string;
          last4: string;
          holder: string;
          expiry: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payment_methods"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          title: string;
          price: number;
          old_price: number | null;
          image: string;
          category: string;
          subcategory: string;
          rating: number;
          description: string;
          tags: string[];
          stock: number;
          location: string;
          seller_id: string;
          sold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          user_name: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          subtotal: number;
          tax: number;
          shipping: number;
          total: number;
          address_name: string;
          address_phone: string;
          address_line1: string;
          address_city: string;
          address_zip: string;
          payment: string;
          payment_status: PaymentStatus;
          status: OrderStatus;
          assigned_to: string | null;
          shipment_id: string | null;
          transaction_ref: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          title: string;
          price: number;
          qty: number;
          image: string;
        };
        Insert: Database["public"]["Tables"]["order_items"]["Row"];
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      order_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          at: string;
          by: string | null;
          note: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["order_history"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["order_history"]["Insert"]>;
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          courier_partner: string;
          tracking_number: string;
          estimated_delivery_date: string;
          shipment_status: OrderStatus;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["shipments"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          type: NotificationType;
          order_id: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
    };
  };
}
