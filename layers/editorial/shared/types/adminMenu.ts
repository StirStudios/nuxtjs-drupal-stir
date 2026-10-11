// Stir Tools contract account.admin.menu (admin-menu.schema.json).
export type AdminMenuLink = {
  title: string
  url: string
  description: string
}

export type AdminMenuSection = AdminMenuLink & {
  children: AdminMenuLink[]
}

export type AdminMenuResponse = {
  sections: AdminMenuSection[]
}
