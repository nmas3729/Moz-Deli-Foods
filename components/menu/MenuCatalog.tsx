"use client";

import { useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { menuCategories, menuItems } from "@/data/menu";
import { business } from "@/data/business";
import { useCart } from "@/components/cart/CartProvider";
import MenuProductImage from "@/components/menu/MenuProductImage";

const categories = ["All", ...menuCategories];

export default function MenuCatalog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const { addItem, itemCount } = useCart();
  const visibleItems = activeCategory === "All"
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);
  const whatsappUrl = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(`Hello ${business.legalName}, could you please share your current ${activeCategory.toLowerCase()} options?`)}`;

  function addToCart(item: (typeof menuItems)[number]) {
    setNotice(addItem(item) ? `${item.name} added to your bag.` : "This item could not be added. Please check the quantity.");
  }

  return (
    <div className="premium-menu-catalog">
      <div className="premium-menu-toolbar">
        <div className="premium-menu-filters" role="group" aria-label="Filter menu by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={activeCategory === category}
              className={activeCategory === category ? "active" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="premium-menu-cart-count"><ShoppingBag size={16} /> {itemCount} {itemCount === 1 ? "item" : "items"} in your bag</p>
      </div>

      {notice && <p className="premium-menu-notice" role="status">{notice}</p>}

      {visibleItems.length > 0 ? (
        <div className="premium-menu-grid grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article className="premium-menu-card group" key={item.id}>
              <div className="premium-menu-photo">
                <MenuProductImage
                  src={item.image}
                  alt={item.imageAlt || item.name}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {(item.requiresPreOrder || item.preOrderRequired) && <span className="premium-preorder-badge">Pre-order required</span>}
              </div>
              <div className="premium-menu-card-content">
                <p className="premium-menu-category">{item.category}</p>
                <h2>{item.name}</h2>
                <p className="premium-menu-description">{item.description}</p>
                {(item.requiresPreOrder || item.preOrderRequired) && <p className="premium-preorder-note">Please allow at least 24 hours&apos; notice.</p>}
                <div className="premium-menu-card-footer">
                  <strong>{item.price === null ? "Ask for price" : `R${item.price.toFixed(2)}`}</strong>
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    disabled={item.price === null || item.availability !== "available"}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <Plus size={16} /> Add to cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="premium-menu-empty">
          <h2>Ask us what&apos;s available.</h2>
          <p>Contact Moz Deli Foods for current {activeCategory.toLowerCase()} options.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">Ask on WhatsApp</a>
        </div>
      )}
    </div>
  );
}
