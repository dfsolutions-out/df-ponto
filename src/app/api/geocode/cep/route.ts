import { NextRequest, NextResponse } from "next/server";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  unidade?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  estado?: string;
  regiao?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
  importance?: number;
  type?: string;
  class?: string;
};

type AddressData = {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  complement: string;
  formattedAddress: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

function sanitizeCep(value: string | null): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 8);
}

function sanitizeText(
  value: string | null,
  maximumLength: number,
): string {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maximumLength);
}

function buildFormattedAddress(params: {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}): string {
  const streetAndNumber = [
    params.street,
    params.number,
  ]
    .filter(Boolean)
    .join(", ");

  const firstLine = [
    streetAndNumber,
    params.complement,
  ]
    .filter(Boolean)
    .join(" - ");

  const location = [
    params.neighborhood,
    params.city,
    params.state,
  ]
    .filter(Boolean)
    .join(", ");

  const address = [
    firstLine,
    location,
    params.cep
      ? `CEP ${params.cep}`
      : "",
  ]
    .filter(Boolean)
    .join(" - ");

  return address;
}

function parseCoordinates(
  result: NominatimResult | undefined,
): Coordinates | null {
  if (!result) {
    return null;
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

async function searchNominatim(
  query: string,
): Promise<NominatimResult | null> {
  if (!query.trim()) {
    return null;
  }

  const url = new URL(
    "https://nominatim.openstreetmap.org/search",
  );

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent":
        "DF-Ponto/1.0 (sistema interno de geolocalizacao)",
    },

    /*
     * Evita múltiplas consultas desnecessárias para
     * o mesmo endereço em um intervalo curto.
     */
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    console.error(
      "Erro no Nominatim:",
      response.status,
      response.statusText,
    );

    return null;
  }

  const data =
    (await response.json()) as NominatimResult[];

  return data[0] ?? null;
}

async function findBestCoordinates(
  address: AddressData,
): Promise<{
  coordinates: Coordinates | null;
  precision:
    | "exact"
    | "street"
    | "cep"
    | "city"
    | "none";
  displayName: string | null;
}> {
  const exactQuery = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.state,
    address.cep,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const exactResult =
    await searchNominatim(exactQuery);

  const exactCoordinates =
    parseCoordinates(exactResult ?? undefined);

  if (exactCoordinates) {
    return {
      coordinates: exactCoordinates,
      precision: "exact",
      displayName:
        exactResult?.display_name ?? null,
    };
  }

  const streetQuery = [
    address.street,
    address.neighborhood,
    address.city,
    address.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const streetResult =
    await searchNominatim(streetQuery);

  const streetCoordinates =
    parseCoordinates(streetResult ?? undefined);

  if (streetCoordinates) {
    return {
      coordinates: streetCoordinates,
      precision: "street",
      displayName:
        streetResult?.display_name ?? null,
    };
  }

  const cepQuery = [
    address.cep,
    address.city,
    address.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const cepResult =
    await searchNominatim(cepQuery);

  const cepCoordinates =
    parseCoordinates(cepResult ?? undefined);

  if (cepCoordinates) {
    return {
      coordinates: cepCoordinates,
      precision: "cep",
      displayName:
        cepResult?.display_name ?? null,
    };
  }

  const cityQuery = [
    address.city,
    address.state,
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");

  const cityResult =
    await searchNominatim(cityQuery);

  const cityCoordinates =
    parseCoordinates(cityResult ?? undefined);

  if (cityCoordinates) {
    return {
      coordinates: cityCoordinates,
      precision: "city",
      displayName:
        cityResult?.display_name ?? null,
    };
  }

  return {
    coordinates: null,
    precision: "none",
    displayName: null,
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const cep = sanitizeCep(
    request.nextUrl.searchParams.get("cep"),
  );

  const number = sanitizeText(
    request.nextUrl.searchParams.get("number"),
    30,
  );

  const complement = sanitizeText(
    request.nextUrl.searchParams.get(
      "complement",
    ),
    120,
  );

  if (cep.length !== 8) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Informe um CEP válido com 8 dígitos.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const viaCepResponse = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`,
      {
        headers: {
          Accept: "application/json",
        },

        next: {
          revalidate: 86400,
        },
      },
    );

    if (!viaCepResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não foi possível consultar o CEP.",
        },
        {
          status: 502,
        },
      );
    }

    const viaCepData =
      (await viaCepResponse.json()) as ViaCepResponse;

    if (viaCepData.erro) {
      return NextResponse.json(
        {
          success: false,
          message: "CEP não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    const street =
      viaCepData.logradouro?.trim() ?? "";

    const neighborhood =
      viaCepData.bairro?.trim() ?? "";

    const city =
      viaCepData.localidade?.trim() ?? "";

    const state =
      viaCepData.uf?.trim() ?? "";

    const formattedCep = `${cep.slice(
      0,
      5,
    )}-${cep.slice(5)}`;

    const address: AddressData = {
      cep: formattedCep,
      street,
      neighborhood,
      city,
      state,
      number,
      complement,
      formattedAddress:
        buildFormattedAddress({
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          cep: formattedCep,
        }),
    };

    const location =
      await findBestCoordinates(address);

    return NextResponse.json({
      success: true,
      message:
        location.precision === "exact"
          ? "Endereço localizado. Clique no mapa para confirmar o ponto exato."
          : location.precision === "street"
            ? "Rua localizada. Clique no mapa para marcar o imóvel exato."
            : location.precision === "cep"
              ? "Região do CEP localizada. Clique no mapa para marcar o imóvel."
              : location.precision === "city"
                ? "O mapa foi centralizado na cidade. Navegue e selecione o local."
                : "Endereço preenchido. Navegue manualmente pelo mapa para selecionar o local.",

      address,

      location: {
        latitude:
          location.coordinates?.latitude ??
          null,

        longitude:
          location.coordinates?.longitude ??
          null,

        precision: location.precision,

        displayName:
          location.displayName,
      },
    });
  } catch (error) {
    console.error(
      "Erro na consulta de geolocalização:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível consultar a localização agora.",
      },
      {
        status: 500,
      },
    );
  }
}