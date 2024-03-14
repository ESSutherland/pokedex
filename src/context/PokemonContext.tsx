import {
  Ability,
  MainClient,
  Name,
  NamedAPIResource,
  Pokemon,
  PokemonAbility,
  PokemonForm,
  PokemonSpecies,
} from "pokenode-ts";
import React, { useContext } from "react";
import { useEffect, useState, useCallback, createContext } from "react";
import blocked_forms from "../data";

interface PokemonContextProps {
  children: React.ReactNode;
}

interface PokemonContextType {
  isLoading: boolean;
  pokemonId: number;
  speciesData: PokemonSpecies | undefined;
  varietiesList: Pokemon[] | undefined;
  formsList: PokemonForm[] | undefined;
  pokemonData: Pokemon | undefined;
  varietyIndex: number;
  pokemonList: NamedAPIResource[] | undefined;
  pokemonGenus: string | undefined;
  abilityList: PokemonAbilityType[] | undefined;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  updatePokemon: (id: number) => void;
  setSpeciesData: React.Dispatch<
    React.SetStateAction<PokemonSpecies | undefined>
  >;
  setVarietiesList: React.Dispatch<React.SetStateAction<Pokemon[] | undefined>>;
  setFormsList: React.Dispatch<React.SetStateAction<PokemonForm[]>>;
  setPokemonData: React.Dispatch<React.SetStateAction<Pokemon | undefined>>;
  updateVariety: (id: number) => void;
  setPokemonList: React.Dispatch<
    React.SetStateAction<NamedAPIResource[] | undefined>
  >;
  getEnglishName: (nameList: Name[] | undefined) => string;
  getEnglish: (nameList: any[] | undefined) => string;
}

interface PokemonAbilityType {
  ability: Ability;
  is_hidden: boolean;
}

const PokemonContext = createContext<PokemonContextType | undefined>(undefined);

const PokemonContextProvider = ({ children }: PokemonContextProps) => {
  const apiClient = new MainClient();

  const [isLoading, setIsLoading] = useState(true);
  const [pokemonId, setPokemonId] = useState(1);
  const [speciesData, setSpeciesData] = useState<PokemonSpecies>();
  const [varietiesList, setVarietiesList] = useState<Pokemon[]>();
  const [formsList, setFormsList] = useState<PokemonForm[]>([]);
  const [pokemonData, setPokemonData] = useState<Pokemon>();
  const [varietyIndex, setVarietyIndex] = useState(0);
  const [pokemonList, setPokemonList] = useState<NamedAPIResource[]>();
  const [pokemonGenus, setPokemonGenus] = useState<string>();
  const [abilityList, setAbilityList] = useState<PokemonAbilityType[]>([]);

  useEffect(() => {
    getPokemonList().then((l) => {
      setPokemonList(l.results);
    });
  }, []);

  useEffect(() => {
    loadData(0);
  }, [pokemonId]);

  useEffect(() => {
    loadData(varietyIndex);
  }, [varietyIndex]);

  const loadData = (id: number) => {
    setIsLoading(true);
    setVarietyIndex(id);
    getPokemonSpeciesData(pokemonId).then((species: PokemonSpecies) => {
      setSpeciesData(species);
      setPokemonGenus(getGenus(species));
      getVarietiesData(species).then((varieties: Pokemon[]) => {
        let list = varieties.filter((x) => {
          return x !== undefined;
        });
        setVarietiesList(list);
        setPokemonData(list[id]);
        getAbilities(list[id]).then((abilities) => {
          getAbilityList(list[id].abilities, abilities).then((abilityList) => {
            setAbilityList(abilityList);
          });
        });
        getForms(list[id]).then((forms) => {
          setFormsList(forms);
          setIsLoading(false);
        });
      });
    });
  };

  const updatePokemon = useCallback(
    (id: number) => {
      setPokemonId(id);
    },
    [pokemonId]
  );

  const updateVariety = useCallback(
    (id: number) => {
      setVarietyIndex(id);
    },
    [pokemonId]
  );

  const getPokemonList = async () => {
    const l = await apiClient.pokemon.listPokemons(0, 1025);
    return l;
  };

  const getPokemonSpeciesData = async (id: number) => {
    const p = await apiClient.pokemon.getPokemonSpeciesById(id);
    return p;
  };

  const getVarietiesData = async (species: PokemonSpecies) => {
    let list = species.varieties.filter((x) => {
      return !blocked_forms.some((ele) => x.pokemon.name.includes(ele));
    });

    let varList = list.map(async (v) => {
      let p = await apiClient.pokemon.getPokemonByName(v.pokemon.name);
      return p;
    });

    return Promise.all(varList);
  };

  const getForms = async (pokemon: Pokemon) => {
    let formList = pokemon.forms.map(async (form) => {
      let f: PokemonForm = await apiClient.pokemon.getPokemonFormByName(
        form.name
      );
      return f;
    });
    return Promise.all(formList);
  };

  const getAbilityList = async (
    list: PokemonAbility[],
    abilities: Ability[]
  ) => {
    const abilityList = list.map((ability, index) => {
      return {
        ability: abilities[index],
        is_hidden: ability.is_hidden,
      };
    });
    return abilityList;
  };

  const getAbilities = async (pokemon: Pokemon) => {
    let abilityList = pokemon.abilities.map(async (ability) => {
      let a: Ability = await apiClient.pokemon.getAbilityByName(
        ability.ability.name
      );
      return a;
    });
    return Promise.all(abilityList);
  };

  const getGenus = (species: PokemonSpecies) => {
    let genus = "";
    species.genera.forEach((gen) => {
      if (gen.language.name === "en") {
        genus = gen.genus;
      }
    });
    return genus;
  };

  const getEnglishName = useCallback((nameList: Name[] | undefined) => {
    let englishName = "";
    nameList?.forEach((name) => {
      if (name.language.name === "en") {
        englishName = name.name;
      }
    });
    return englishName;
  }, []);

  const getEnglish = useCallback((nameList: any[] | undefined) => {
    let englishName = "";
    nameList?.forEach((name) => {
      if (
        name.language.name === "en" &&
        name.version_group.name === "scarlet-violet"
      ) {
        englishName = name.flavor_text;
      }
    });
    return englishName;
  }, []);

  return (
    <PokemonContext.Provider
      value={{
        isLoading,
        pokemonId,
        speciesData,
        varietiesList,
        formsList,
        pokemonData,
        varietyIndex,
        pokemonList,
        pokemonGenus,
        abilityList,
        setIsLoading,
        updatePokemon,
        setSpeciesData,
        setVarietiesList,
        setFormsList,
        setPokemonData,
        updateVariety,
        setPokemonList,
        getEnglishName,
        getEnglish,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
};

export const usePokemonContext = () => {
  const context = useContext(PokemonContext);
  if (!context) {
    throw new Error(
      "usePokemonContext must be used within a PokemonContextProvider"
    );
  }
  return context;
};

export default PokemonContextProvider;
