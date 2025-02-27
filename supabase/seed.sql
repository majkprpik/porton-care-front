INSERT INTO public.venue_types (venue_types_id, venue_type_name) VALUES
  ('c0aa8ab7-bb73-4a8e-8ddd-189a714c1114', 'Couple'),
  ('df54b2a6-ac2c-48c7-afda-04ab19d9a938', 'Family 2'),
  ('e0295417-7a9c-404b-a1cb-25908f4c65b7', 'Family 1')
ON CONFLICT (venue_types_id) DO NOTHING;


insert into public.venues (venue_name, venue_types_id)
values
  ('641', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('642', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('643', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('201', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('202', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('203', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('520', 'e0295417-7a9c-404b-a1cb-25908f4c65b7'),
  ('521', 'e0295417-7a9c-404b-a1cb-25908f4c65b7'),
  ('522', 'e0295417-7a9c-404b-a1cb-25908f4c65b7');

INSERT INTO public.venue_status_progress_types ( venue_status_progress_type_id, venue_status_progress_type_name) VALUES
 ('044b841b-1797-4ec1-a9ab-00af6f1281a0','Pending'),
 ('53936559-a575-4b55-bb12-1b886e64e21a','In progress'),
 ('6dab6ddc-973c-444b-b3dd-8a855b95a814','Finished')
