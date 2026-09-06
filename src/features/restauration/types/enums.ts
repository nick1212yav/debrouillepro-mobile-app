export enum OrderStatus {
  PENDING_PAYMENT = "pending_payment",
  RECEIVED = "received",
  PREPARING = "preparing",
  READY_FOR_PICKUP = "ready_for_pickup",
  IN_DELIVERY = "in_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentGateway {
  ORANGE_MONEY = "orange_money",
  WAVE = "wave",
  MOOV = "moov",
  MTN = "mtn",
  CASH = "cash",
  CARD = "card",
  CRYPTO = "crypto",
}

export enum BCGMatrixClass {
  STAR = "STAR",
  PLOWHORSE = "PLOWHORSE",
  PUZZLE = "PUZZLE",
  DOG = "DOG",
}

export enum CustomerSegment {
  VIP = "VIP",
  LOYAL = "Loyal",
  OCCASIONAL = "Occasional",
  AT_RISK = "At Risk",
  INACTIVE = "Inactive",
}

export enum TableSection {
  STANDARD = "standard",
  TERRACE = "terrace",
  VIP = "vip",
  PRIVATE_ROOM = "private_room",
}

export enum CuisineType {
  AFRICAINE = "Africaine",
  FUSION = "Fusion",
  PIZZA = "Pizza",
  CAFE_SNACK = "Café & Snack",
  GRILLADES = "Grillades",
  EUROPEENNE = "Européenne",
  ASIATIQUE = "Asiatique",
  ARABE = "Arabe",
}

export enum DietType {
  VEGAN = "vegan",
  VEGETARIAN = "vegetarian",
  HALAL = "halal",
  KOSHER = "kosher",
  GLUTEN_FREE = "gluten-free",
  NONE = "none",
}

export enum RestaurationRole {
  CLIENT = "client",
  COURIER = "courier",
  RESTAURANT_OWNER = "restaurant_owner",
  CHEF = "chef",
  ADMINISTRATOR = "administrator",
}
