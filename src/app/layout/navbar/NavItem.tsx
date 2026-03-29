import { Fragment, useMemo, useState } from "react";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import {
  Box,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import {
  isNavigationItemActive,
  type NavigationItem,
} from "@/app/layout/navbar/navigation";

type NavItemProps = {
  item: NavigationItem;
  variant: "desktop" | "mobile";
  depth?: number;
  onNavigate?: () => void;
};

export function NavItem({
  item,
  variant,
  depth = 0,
  onNavigate,
}: NavItemProps) {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const active = useMemo(
    () => isNavigationItemActive(location.pathname, item),
    [item, location.pathname],
  );
  const hasChildren = Boolean(item.children?.length);
  const desktopMenuOpen = Boolean(anchorEl);

  if (variant === "desktop") {
    const handleDesktopNavigate = () => {
      setAnchorEl(null);
      onNavigate?.();
    };

    if (!hasChildren && item.to) {
      return (
        <Button
          color="inherit"
          component={NavLink}
          sx={{
            borderRadius: 999,
            color: active ? "primary.main" : "text.primary",
            fontWeight: active ? 700 : 600,
            minHeight: 44,
            px: 1.75,
            whiteSpace: "nowrap",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
          to={item.to}
          onClick={handleDesktopNavigate}
        >
          <Box
            sx={{
              alignItems: "center",
              display: "inline-flex",
              gap: 1,
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Box>
        </Button>
      );
    }

    return (
      <Fragment>
        <Button
          aria-controls={desktopMenuOpen ? `${item.id}-menu` : undefined}
          aria-expanded={desktopMenuOpen ? "true" : undefined}
          aria-haspopup={hasChildren ? "menu" : undefined}
          color="inherit"
          endIcon={
            hasChildren ? (
              <ExpandMoreRounded
                sx={{
                  transform: desktopMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: (theme) =>
                    theme.transitions.create("transform", {
                      duration: theme.transitions.duration.shortest,
                    }),
                }}
              />
            ) : undefined
          }
          sx={{
            borderRadius: 999,
            color: active ? "primary.main" : "text.primary",
            fontWeight: active ? 700 : 600,
            minHeight: 44,
            px: 1.75,
            whiteSpace: "nowrap",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
          onClick={(event) => {
            if (hasChildren) {
              setAnchorEl(event.currentTarget);
              return;
            }

            onNavigate?.();
          }}
          onMouseEnter={(event) => {
            if (hasChildren) {
              setAnchorEl(event.currentTarget);
            }
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              display: "inline-flex",
              gap: 1,
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Box>
        </Button>

        {hasChildren && (
          <Menu
            MenuListProps={{
              onMouseLeave: () => setAnchorEl(null),
            }}
            anchorEl={anchorEl}
            id={`${item.id}-menu`}
            open={desktopMenuOpen}
            onClose={() => setAnchorEl(null)}
          >
            {item.to && (
              <MenuItem
                component={NavLink}
                selected={active}
                to={item.to}
                onClick={handleDesktopNavigate}
              >
                {item.label}
              </MenuItem>
            )}

            {item.children?.map((child) => (
              <MenuItem
                key={child.id}
                component={child.to ? NavLink : "button"}
                disabled={!child.to}
                selected={isNavigationItemActive(location.pathname, child)}
                sx={{ minWidth: 220 }}
                to={child.to}
                onClick={handleDesktopNavigate}
              >
                <Box
                  sx={{
                    alignItems: "center",
                    display: "inline-flex",
                    gap: 1,
                  }}
                >
                  {child.icon}
                  <span>{child.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        )}
      </Fragment>
    );
  }

  const mobileItemContent = (
    <>
      {item.icon && (
        <ListItemIcon
          sx={{
            color: active ? "primary.main" : "text.secondary",
            minWidth: 40,
          }}
        >
          {item.icon}
        </ListItemIcon>
      )}
      <ListItemText
        primary={item.label}
        primaryTypographyProps={{
          fontWeight: active ? 700 : 500,
        }}
        secondary={item.description}
        secondaryTypographyProps={{
          sx: {
            mt: 0.25,
          },
        }}
      />
      {hasChildren && (
        <Box
          aria-hidden
          color="text.secondary"
          sx={{ alignItems: "center", display: "inline-flex", ml: 1 }}
        >
          {expanded || active ? <ExpandLessRounded /> : <ExpandMoreRounded />}
        </Box>
      )}
      {!hasChildren && (
        <Box
          aria-hidden
          color="text.secondary"
          sx={{ alignItems: "center", display: "inline-flex", ml: 1 }}
        >
          <ChevronRightRounded fontSize="small" />
        </Box>
      )}
    </>
  );

  return (
    <Box>
      <ListItemButton
        component={!hasChildren && item.to ? NavLink : "button"}
        selected={active}
        sx={{
          borderRadius: 3,
          minHeight: 52,
          pl: 1.5 + depth * 1.5,
          pr: 1.5,
        }}
        to={!hasChildren ? item.to : undefined}
        onClick={() => {
          if (hasChildren) {
            setExpanded((current) => !current);
            return;
          }

          onNavigate?.();
        }}
      >
        {mobileItemContent}
      </ListItemButton>

      {hasChildren && (
        <Collapse in={expanded || active} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ display: "grid", gap: 0.5, pt: 0.5 }}>
            {item.to && (
              <ListItemButton
                component={NavLink}
                selected={item.to === location.pathname}
                sx={{
                  borderRadius: 3,
                  minHeight: 48,
                  pl: 3 + depth * 1.5,
                  pr: 1.5,
                }}
                to={item.to}
                onClick={onNavigate}
              >
                <ListItemText
                  primary={`${item.label} overview`}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            )}

            {item.children?.map((child) => (
              <NavItem
                key={child.id}
                depth={depth + 1}
                item={child}
                variant="mobile"
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
