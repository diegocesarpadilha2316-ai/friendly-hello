import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export interface SidebarNavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  brand?: React.ReactNode;
  groups: SidebarNavGroup[];
}

export function Sidebar({ brand, groups }: SidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <ShadSidebar collapsible="icon">
      {brand ? (
        <SidebarHeader className="px-3 py-3 text-sm font-semibold">{brand}</SidebarHeader>
      ) : null}
      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? `group-${i}`}>
            {group.label && !collapsed ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        aria-disabled={item.disabled}
                      >
                        <Link
                          to={item.disabled ? "." : item.url}
                          className="flex items-center gap-2"
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </ShadSidebar>
  );
}