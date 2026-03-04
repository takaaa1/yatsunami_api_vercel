# Erro: "new row violates row-level security policy" ao atualizar foto de perfil

## Causa

O upload da foto de perfil usa o **Supabase Storage** (bucket `avatars`). O Storage do Supabase usa **Row Level Security (RLS)**. A API faz o upload no backend com o client Supabase; se a **chave service role** não estiver configurada, o backend usa a chave **anon**, e a anon não tem permissão para inserir linhas no Storage → aparece o erro `new row violates row-level security policy`.

## Solução recomendada: configurar a Service Role Key

1. No **Supabase Dashboard**: **Settings** → **API**.
2. Copie a chave **service_role** (secret; não use no frontend).
3. No ambiente onde a API roda (Vercel, Railway, `.env` local, etc.), defina:
   ```bash
   SUPABASE_SERVICE_KEY=<sua_service_role_key>
   ```
4. Reinicie a API e tente de novo o upload da foto de perfil.

Com a service role configurada, o client admin do backend contorna o RLS e o upload/delete no bucket `avatars` passam a funcionar.

## Verificação no código

O `SupabaseService` usa `SUPABASE_SERVICE_KEY` (mapeada em `configuration.ts` como `supabase.serviceKey`). Se essa variável não existir, o módulo usa a anon key para operações de Storage e:
- em **uploadFile** / **deleteFile** o código agora lança um erro explícito pedindo para configurar `SUPABASE_SERVICE_KEY`;
- assim fica claro que o problema é a falta da chave no ambiente (e não apenas “RLS” genérico).

## Não use a service role no frontend

A chave **service_role** ignora RLS e dá acesso total ao projeto. Use apenas no backend (API) e nunca em código que roda no browser ou no app (Expo/React Native).
