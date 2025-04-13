-- Create storage bucket for post media
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true);

-- Set up storage policies for post media
create policy "Post media is publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'post-media' );

create policy "Authenticated users can upload post media."
  on storage.objects for insert
  with check ( bucket_id = 'post-media' AND auth.role() = 'authenticated' );

create policy "Users can update their own post media."
  on storage.objects for update
  using ( bucket_id = 'post-media' AND auth.uid() = owner );

create policy "Users can delete their own post media."
  on storage.objects for delete
  using ( bucket_id = 'post-media' AND auth.uid() = owner );