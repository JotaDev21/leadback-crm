-- LeadBack MVP. Apply once in a new Supabase project.
create extension if not exists pgcrypto;
create table public.companies (
 id uuid primary key default gen_random_uuid(), name text not null default 'Minha empresa',
 segment text not null default '', business_start time not null default '09:00',
 business_end time not null default '18:00', average_ticket numeric(12,2) not null default 0 check(average_ticket>=0),
 agent_count integer not null default 1 check(agent_count>0), whatsapp_connected boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.users (
 id uuid primary key references auth.users(id) on delete cascade,
 company_id uuid not null references public.companies(id), name text not null default '',
 role text not null default 'member' check(role in ('owner','member')),created_at timestamptz not null default now()
);
create table public.contacts (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 name text not null,phone text not null,created_at timestamptz not null default now(),unique(id,company_id),unique(company_id,phone)
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 contact_id uuid not null,provider_id text,created_at timestamptz not null default now(),unique(id,contact_id,company_id),
 foreign key(contact_id,company_id) references public.contacts(id,company_id) on delete cascade
);
create table public.messages (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 contact_id uuid not null,conversation_id uuid not null,provider_id text unique,
 direction text not null check(direction in ('inbound','outbound')),body text not null,created_at timestamptz not null default now(),
 foreign key(conversation_id,contact_id,company_id) references public.conversations(id,contact_id,company_id) on delete cascade
);
create table public.opportunities (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 contact_id uuid not null,category text not null check(category in ('hot_lead','quote_sent','awaiting_reply','forgotten','old_customer','followup_pending')),
 score integer not null check(score between 0 and 100),estimated_value numeric(12,2) not null default 0 check(estimated_value>=0),
 reason text not null default '',summary text not null default '',intent text not null default '',
 status text not null default 'open' check(status in ('open','recovered','ignored')),
 last_interaction timestamptz not null default now(),recovered_at timestamptz,
 created_at timestamptz not null default now(),foreign key(contact_id,company_id) references public.contacts(id,company_id) on delete cascade
);
create table public.followups (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 contact_id uuid not null,message text not null check(length(trim(message))>0),scheduled_at timestamptz not null,
 status text not null default 'scheduled' check(status in ('scheduled','sent','cancelled')),
 sent_at timestamptz,created_at timestamptz not null default now(),
 foreign key(contact_id,company_id) references public.contacts(id,company_id) on delete cascade
);
create table public.automation_rules (
 id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,
 delay_hours integer not null check(delay_hours in (24,72,168)),enabled boolean not null default false,unique(company_id,delay_hours)
);
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(),company_id uuid not null unique references public.companies(id) on delete cascade,
 plan text not null default 'demo',status text not null default 'inactive',provider_id text,created_at timestamptz not null default now()
);
create index users_company_idx on public.users(company_id);
create index conversations_contact_idx on public.conversations(company_id,contact_id);
create index messages_conversation_idx on public.messages(company_id,conversation_id,created_at);
create index opportunities_company_status_idx on public.opportunities(company_id,status,score desc);
create index followups_due_idx on public.followups(scheduled_at) where status='scheduled';
create index followups_contact_idx on public.followups(company_id,contact_id);

-- Use definer helpers to avoid recursive profile policies. Clients cannot change membership.
create function public.current_company_id() returns uuid language sql stable security definer set search_path='' as $$
 select company_id from public.users where id=(select auth.uid())
$$;
create function public.is_company_owner() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select role='owner' from public.users where id=(select auth.uid())),false)
$$;
revoke all on function public.current_company_id() from public;
revoke all on function public.is_company_owner() from public;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.is_company_owner() to authenticated;

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.opportunities enable row level security;
alter table public.followups enable row level security;
alter table public.automation_rules enable row level security;
alter table public.subscriptions enable row level security;
create policy companies_read on public.companies for select to authenticated using(id=public.current_company_id());
create policy companies_edit on public.companies for update to authenticated using(id=public.current_company_id() and public.is_company_owner()) with check(id=public.current_company_id() and public.is_company_owner());
create policy users_read on public.users for select to authenticated using(company_id=public.current_company_id());
create policy contacts_access on public.contacts for all to authenticated using(company_id=public.current_company_id()) with check(company_id=public.current_company_id());
create policy conversations_read on public.conversations for select to authenticated using(company_id=public.current_company_id());
create policy messages_read on public.messages for select to authenticated using(company_id=public.current_company_id());
create policy opportunities_read on public.opportunities for select to authenticated using(company_id=public.current_company_id());
create policy opportunities_edit on public.opportunities for update to authenticated using(company_id=public.current_company_id()) with check(company_id=public.current_company_id());
create policy followups_access on public.followups for all to authenticated using(company_id=public.current_company_id()) with check(company_id=public.current_company_id());
create policy rules_access on public.automation_rules for all to authenticated using(company_id=public.current_company_id() and public.is_company_owner()) with check(company_id=public.current_company_id() and public.is_company_owner());
create policy subscriptions_read on public.subscriptions for select to authenticated using(company_id=public.current_company_id());

-- New accounts own a separate workspace. Never trust client-supplied company IDs.
create function public.provision_user() returns trigger language plpgsql security definer set search_path='' as $$
declare cid uuid;
begin
 insert into public.companies(name) values('Minha empresa') returning id into cid;
 insert into public.users(id,company_id,role) values(new.id,cid,'owner');
 insert into public.automation_rules(company_id,delay_hours,enabled) values(cid,24,true),(cid,72,false),(cid,168,false);
 insert into public.subscriptions(company_id) values(cid);
 return new;
end;
$$;
revoke all on function public.provision_user() from public;
create trigger provision_leadback_user after insert on auth.users for each row execute function public.provision_user();

-- Atomically stop every unsent follow-up when an inbound message is ingested.
-- Out-of-order webhooks cancel only jobs that existed at message time.
create function public.cancel_followups_on_reply() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.direction='inbound' then
  update public.followups set status='cancelled'
  where company_id=new.company_id and contact_id=new.contact_id and status='scheduled' and created_at<=new.created_at;
 end if;
 return new;
end;
$$;
revoke all on function public.cancel_followups_on_reply() from public;
create trigger cancel_followups_after_message after insert on public.messages for each row execute function public.cancel_followups_on_reply();

-- Limit client changes to the fields actually exposed by the application.
revoke all on public.users,public.subscriptions,public.conversations,public.messages,public.opportunities,public.companies from anon,authenticated;
grant select on public.users,public.subscriptions,public.conversations,public.messages,public.opportunities,public.companies to authenticated;
grant update(name,segment,business_start,business_end,average_ticket,agent_count) on public.companies to authenticated;
grant update(status,recovered_at,last_interaction) on public.opportunities to authenticated;
revoke all on public.contacts,public.followups,public.automation_rules from anon;
grant select,insert,update,delete on public.contacts,public.followups,public.automation_rules to authenticated;
