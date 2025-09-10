interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <div className="">
      <div className="px-10 ">
        {children}
      </div>
    </div>
  );
};

export default Layout;
