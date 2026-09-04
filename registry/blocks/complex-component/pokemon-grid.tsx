import { useEffect, useState } from "react";
import {
  getPokemon,
  getPokemonList,
} from "@/registry/blocks/complex-component/lib/pokemon";
import { PokemonImage } from "@/registry/blocks/complex-component/components/pokemon-image";
import { Card, CardContent } from "@/registry/ui/card";

// Client-side version of the complex-component block for browser previews.
// The block's entry (pokemon-list.tsx) is an async server component,
// which only renders inside RSC hosts like Next.js.

export function PokemonGrid() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    getPokemonList({ limit: 12 }).then((result) => {
      if (result) setNames(result.results.map((p) => p.name));
    });
  }, []);

  if (names.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="grid grid-cols-2 gap-4 py-10 sm:grid-cols-3 md:grid-cols-4">
        {names.map((name) => (
          <PreviewPokemonCard key={name} name={name} />
        ))}
      </div>
    </div>
  );
}

function PreviewPokemonCard({ name }: { name: string }) {
  const [pokemon, setPokemon] =
    useState<Awaited<ReturnType<typeof getPokemon>>>(null);

  useEffect(() => {
    getPokemon(name).then(setPokemon);
  }, [name]);

  if (!pokemon) {
    return null;
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center p-2">
        <div>
          <PokemonImage name={pokemon.name} number={pokemon.id} />
        </div>
        <div className="text-center font-medium">{pokemon.name}</div>
      </CardContent>
    </Card>
  );
}
