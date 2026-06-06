from decimal import Decimal, ROUND_HALF_UP

ZERO = Decimal("0.00")


def quantize_money(value):
    if value is None:
        return ZERO
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def as_money_string(value):
    return str(quantize_money(value))