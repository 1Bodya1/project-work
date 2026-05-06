import { Link } from 'react-router';

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  title?: string;
  price: number;
  colors?: string[];
  sizes?: string[];
  customizable?: boolean;
  isCustomizable?: boolean;
}

export function ProductCard({
  id,
  image,
  name,
  title,
  price,
  colors = [],
  sizes = [],
  customizable,
  isCustomizable,
}: ProductCardProps) {
  const displayTitle = title || name;
  const canCustomize = isCustomizable ?? customizable;

  return (
    <div className="group">
      <Link to={`/product/${id}`} className="block">
        <div className="aspect-square bg-[#F5F5F5] rounded overflow-hidden mb-3">
          <img
            src={image}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="mb-1">{displayTitle}</h3>
        <p className="text-[#1A1A1A] text-sm mb-2">₴{price}</p>
        {colors.length > 0 && (
          <div className="flex gap-1.5 mb-2">
            {colors.map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        {sizes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sizes.map((size) => (
              <span key={size} className="text-xs px-2 py-1 border border-black/10 rounded">
                {size}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className="space-y-2">
        <Link
          to={`/product/${id}`}
          className="w-full block text-center px-4 py-2.5 bg-[#7A1F2A] text-white rounded hover:bg-[#5A1520] transition-colors"
        >
          View product
        </Link>
        {canCustomize && (
          <Link
            to={`/customize/${id}`}
            className="w-full block text-center px-4 py-2.5 border border-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Customize
          </Link>
        )}
      </div>
    </div>
  );
}
