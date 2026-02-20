declare module "react-simple-maps" {
  import { ComponentType, SVGProps } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    className?: string;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: any;
    children: (args: { geographies: any[] }) => React.ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: any;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
