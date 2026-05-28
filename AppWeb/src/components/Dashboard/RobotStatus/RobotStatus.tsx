import styles from './RobotStatus.module.css';

const RobotStatus = ({ isSearching, operationStatus }) => {
  return (
    <section className={styles.statusSection}>
      <div className={styles.statusFlex}>
        <div>
          <h4 className={styles.title}>Telemetria do Robô</h4>
          <p className={styles.subtitle}>
            {operationStatus}
          </p>
        </div>
        
        <div className={styles.indicatorContainer}>
          <span className={`${styles.statusText} ${isSearching ? styles.textActive : styles.textIdle}`}>
            {isSearching ? 'EM ROTA' : 'STANDBY'}
          </span>
          
          <div className={`${styles.dot} ${isSearching ? styles.active : styles.idle}`}></div>
        </div>
      </div>
    </section>
  );
};

export default RobotStatus;