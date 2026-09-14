type PlaceholderPageProps = {
  title: string;
};

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => (
  <>
    <h1 className="page-title">{title}</h1>
    <section className="surface">Trang khung đã sẵn sàng kết nối API.</section>
  </>
);
