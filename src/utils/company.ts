export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatPostalCode(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatCurrencyFromInput(
  value: string,
): string {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;

  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatCompanyStatus(
  status: "active" | "suspended" | "cancelled",
): string {
  const labels = {
    active: "Ativa",
    suspended: "Suspensa",
    cancelled: "Cancelada",
  };

  return labels[status];
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  function calculateDigit(base: string): number {
    let weight = base.length - 7;
    let total = 0;

    for (const digit of base) {
      total += Number(digit) * weight;
      weight -= 1;

      if (weight < 2) {
        weight = 9;
      }
    }

    const remainder = total % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstDigit = calculateDigit(cnpj.slice(0, 12));

  const secondDigit = calculateDigit(
    `${cnpj.slice(0, 12)}${firstDigit}`,
  );

  return (
    cnpj ===
    `${cnpj.slice(0, 12)}${firstDigit}${secondDigit}`
  );
}