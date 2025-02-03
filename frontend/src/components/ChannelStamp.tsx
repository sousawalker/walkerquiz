import logo from '../imgs/logo-walkerquiz.jpg';

export const ChannelStamp = () => {
  return (
    <div className="channel-stamp">
      <div className="channel-avatar-wrapper">
        <img className="channel-avatar" src={logo} />

        <span className="bell-icon">🔔</span>
      </div>

      <h2 className="channel-name">
        walker
        <span>quiz</span>
      </h2>
    </div>
  );
};
