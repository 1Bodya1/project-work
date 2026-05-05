import { Link } from 'react-router';

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  price: number;
  colors?: string[];
}

export function ProductCard({ id, image, name, price, colors = [] }: ProductCardProps) {
  return (
    <div className="group">
      <Link to={`/product/${id}`} className="block">
        <div className="aspect-square bg-[#F5F5F5] rounded overflow-hidden mb-3">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="mb-1">{name}</h3>
        <p className="text-[#1A1A1A] text-sm mb-2">₴{price}</p>
        {colors.length > 0 && (
          <div className="flex gap-1.5">
            {colors.map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </Link>
      <Link
        to={`/customize/${id}`}
        className="mt-3 w-full block text-center px-4 py-2.5 border border-black rounded hover:bg-black hover:text-white transition-colors"
      >
        Customize
      </Link>
    </div>
  );
}
