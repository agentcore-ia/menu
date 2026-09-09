-- Estilo de cards en lista para la plantilla pizzeria: una card por fila, con
-- la foto a la derecha. Va por cards_style para que cada menu elija: el que
-- quedo en 'pizzeria-grid' no cambia.
alter table if exists public.restaurant_menu_presentations
  drop constraint if exists restaurant_menu_presentations_cards_style_check;

alter table if exists public.restaurant_menu_presentations
  add constraint restaurant_menu_presentations_cards_style_check
  check (cards_style in (
    'editorial-list',
    'magazine-list',
    'glass-list',
    'gelato-cards',
    'pizzeria-grid',
    'pizzeria-lista',
    'burger-grid',
    'blue-burger-list',
    'host-grid',
    'kika-cards',
    'florian-list',
    'sabor-pampa-cards'
  ));
