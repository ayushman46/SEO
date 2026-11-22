import { nodeTypes, type JsonLdNode } from "../../html";

/** Common Organization / LocalBusiness types (schema.org has hundreds of subtypes). */
const ORG_TYPES = new Set(
  [
    "Organization",
    "Corporation",
    "LocalBusiness",
    "OnlineBusiness",
    "OnlineStore",
    "NGO",
    "NewsMediaOrganization",
    "EducationalOrganization",
    "MedicalOrganization",
    "SportsOrganization",
    "GovernmentOrganization",
    "ProfessionalService",
    "Store",
    "Restaurant",
    "FoodEstablishment",
    "CafeOrCoffeeShop",
    "Bakery",
    "BarOrPub",
    "Dentist",
    "Physician",
    "MedicalClinic",
    "Hospital",
    "Pharmacy",
    "Optician",
    "LegalService",
    "Attorney",
    "Notary",
    "AccountingService",
    "FinancialService",
    "InsuranceAgency",
    "RealEstateAgent",
    "HomeAndConstructionBusiness",
    "Plumber",
    "Electrician",
    "HVACBusiness",
    "RoofingContractor",
    "GeneralContractor",
    "HousePainter",
    "Locksmith",
    "MovingCompany",
    "AutomotiveBusiness",
    "AutoRepair",
    "AutoDealer",
    "HealthAndBeautyBusiness",
    "BeautySalon",
    "HairSalon",
    "DaySpa",
    "NailSalon",
    "HealthClub",
    "ExerciseGym",
    "LodgingBusiness",
    "Hotel",
    "BedAndBreakfast",
    "ChildCare",
    "Preschool",
    "VeterinaryCare",
    "TravelAgency",
    "EmploymentAgency",
    "EntertainmentBusiness",
    "SportsActivityLocation",
    "ShoppingCenter",
    "Florist",
    "ClothingStore",
    "ElectronicsStore",
    "FurnitureStore",
    "GroceryStore",
    "HardwareStore",
    "JewelryStore",
    "PetStore",
  ].map((t) => t.toLowerCase()),
);

export function isOrgType(type: string): boolean {
  const t = type.toLowerCase();
  if (ORG_TYPES.has(t)) return true;
  // "Service" alone is an offering, not an organization.
  return t !== "service" && /(business|organization|store|service|agency|clinic|contractor)$/.test(t);
}

export function isOrgNode(node: JsonLdNode): boolean {
  return nodeTypes(node).some(isOrgType);
}

export function stringProp(node: JsonLdNode, key: string): string | null {
  const v = node[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v)) {
    const s = v.find((x): x is string => typeof x === "string" && x.trim().length > 0);
    if (s) return s.trim();
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as JsonLdNode;
    for (const k of ["url", "@id", "contentUrl", "name"]) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return null;
}

export function hasProp(node: JsonLdNode, key: string): boolean {
  const v = node[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
