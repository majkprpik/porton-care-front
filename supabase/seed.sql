INSERT INTO public.venue_types (venue_types_id, venue_type_name) VALUES
  ('c0aa8ab7-bb73-4a8e-8ddd-189a714c1114', 'Couple'),
  ('df54b2a6-ac2c-48c7-afda-04ab19d9a938', 'Family 2'),
  ('e0295417-7a9c-404b-a1cb-25908f4c65b7', 'Family 1')
ON CONFLICT (venue_types_id) DO NOTHING;


insert into public.venues (venue_id, venue_name, venue_types_id)
values
  ('d1b313f5-7ed7-4ea9-b0c9-5dc9c071efa4', '641', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('ea9be3e2-c225-485e-831a-912c79df3f65', '642', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('400d3164-e854-4f7e-a2bc-a19810270669', '643', 'c0aa8ab7-bb73-4a8e-8ddd-189a714c1114'),
  ('59eaf9a7-9eca-4b49-9573-7b6afe4bd71b', '201', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('2a0c4eda-41bc-416a-b474-4f7c973a0068', '202', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('4a70bde7-3ccd-4fb3-bc87-4aba2ff79ec1', '203', 'df54b2a6-ac2c-48c7-afda-04ab19d9a938'),
  ('ce467ca7-62d2-4f75-9752-8b50e56381aa', '520', 'e0295417-7a9c-404b-a1cb-25908f4c65b7'),
  ('16b595ef-963a-45a7-8bf0-06e0ea3522c2', '521', 'e0295417-7a9c-404b-a1cb-25908f4c65b7'),
  ('33dbd6b4-d470-4649-8f98-0dbebabb4298', '522', 'e0295417-7a9c-404b-a1cb-25908f4c65b7');

INSERT INTO public.venue_status_progress_types ( venue_status_progress_type_id, venue_status_progress_type_name) VALUES
 ('044b841b-1797-4ec1-a9ab-00af6f1281a0','Pending'),
 ('53936559-a575-4b55-bb12-1b886e64e21a','In progress'),
 ('6dab6ddc-973c-444b-b3dd-8a855b95a814','Finished');

insert into public.venue_status_types (venue_status_type_id, venue_status_type_name)
values
  ('3f20d43b-4303-408f-a18e-1ca1cc9608e1', 'Needs cleaning'),
  ('15ce72d1-1d40-47ec-bd12-b5c6babd484d', 'Needs deck cleaning'),
  ('fa03424e-b3de-4424-9dd4-9fb2a2f7652c', 'Needs maintenance'),
  ('77d916a8-424b-4b3c-84cc-ac43dc082ad1', 'Needs repair'),
  ('450ed88f-ecc5-4e91-b209-b653022e9708', 'Occupied'),
  ('4fc943df-0cbb-4e69-9294-ff9f51cfa363', 'Reserved'),
  ('0b2837a5-0f06-47c3-a95f-28d744322475', 'Empty');

insert into public.venue_statuses (venue_status_type_id, venue_id, venue_status_progress_type_id, start_time, comment)
values
  ('3f20d43b-4303-408f-a18e-1ca1cc9608e1', 'd1b313f5-7ed7-4ea9-b0c9-5dc9c071efa4', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', ''),
  ('15ce72d1-1d40-47ec-bd12-b5c6babd484d', 'd1b313f5-7ed7-4ea9-b0c9-5dc9c071efa4', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', ''),
  ('450ed88f-ecc5-4e91-b209-b653022e9708', 'd1b313f5-7ed7-4ea9-b0c9-5dc9c071efa4', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', ''),
  ('77d916a8-424b-4b3c-84cc-ac43dc082ad1', 'ce467ca7-62d2-4f75-9752-8b50e56381aa', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', ''),
  ('450ed88f-ecc5-4e91-b209-b653022e9708', 'ce467ca7-62d2-4f75-9752-8b50e56381aa', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', ''),
  ('4fc943df-0cbb-4e69-9294-ff9f51cfa363', 'ce467ca7-62d2-4f75-9752-8b50e56381aa', '044b841b-1797-4ec1-a9ab-00af6f1281a0', CURRENT_DATE + TIME '08:00:00', '');

  