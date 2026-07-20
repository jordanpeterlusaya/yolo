-- Seed 20 madalali (run in Supabase SQL Editor after migrate-crm.sql)
-- Safe to re-run: skips rows that already match the same name + phone

insert into public.brokers (name, phone, areas, active, created_at, updated_at)
select v.name, v.phone, v.areas, true, now(), now()
from (values
  ('dalali__kigamboni_mbavu', '0769 554 221', 'Kigamboni'),
  ('dalali_kigamboni_simba_dsm', '0746 407 197', 'Kigamboni, Kibada'),
  ('dalali_kigamboni_mahili', '0758 631 303', 'Kigamboni'),
  ('dalali_kigamboni_rasi_namba_1', '0686 705 903', 'Kigamboni'),
  ('dalali__saidi__kigamboni__dsm', '0787 701 266', 'Kigamboni'),
  ('dalali_kigamboni_msauzi', '0756 588 268', 'Kigamboni'),
  ('dalali_kigamboni_viwanja_', '0787 009 242', 'Kigamboni'),
  ('viwanja_bora_kabisa_tz', '0767 053 517', 'Kigamboni'),
  ('dalalidoktatz', '0626 529 397', 'Kigamboni'),
  ('nyumba_kigamboni_tz_dsm', '0746 407 197', 'Kigamboni'),
  ('dalali_salehe_mohamedi', '0712 058 357', 'Kigamboni'),
  ('dalali_patrick_kimara_mbezi', '0672 673 363', 'Kimara, Mbezi, Goba'),
  ('dalali_goba_madale_damasi', '0745 559 598', 'Goba, Madale'),
  ('dalali_amani_kimara', '0787 205 300', 'Kimara, Ubungo, Mbezi, Goba'),
  ('dalali_nyumba_goba', '0714 335 450', 'Goba'),
  ('dalali_goba_festo_mbezi', '0714 539 608', 'Goba, Mbezi'),
  ('dalaligoba_kakubwa', '0749 247 010', 'Goba'),
  ('dalali_mwenge.sinza_mikocheni', '0625 873 687', 'Mwenge, Sinza, Mikocheni'),
  ('dalali_dizzo_ubungo25_', '0677 370 515', 'Ubungo, Kimara'),
  ('damalo_dalali_kimara_ubung_mbz', '0710 614 924', 'Kimara, Ubungo, Mbezi')
) as v(name, phone, areas)
where not exists (
  select 1 from public.brokers b
  where b.name = v.name and b.phone = v.phone
);
