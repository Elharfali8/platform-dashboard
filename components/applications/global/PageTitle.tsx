import type { LucideIcon } from "lucide-react";

type PageTitleProps = {
  title: string;
  icon?: LucideIcon;
};

const PageTitle = ({
  title,
  icon: Icon,
}: PageTitleProps) => {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <Icon className="size-6 text-primary" />
      )}

      <h2 className="text-xl font-semibold capitalize lg:text-2xl">
        {title}
      </h2>
    </div>
  );
};

export default PageTitle;